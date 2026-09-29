#!/usr/bin/env python3
"""
Velora authentication browser evidence runner.

Runs only against Restore-Test using a short-lived service-role fixture.
The service-role key never enters the browser. The browser receives only the
temporary test user's email/password or token hash through page.evaluate().
"""
import json
import os
import secrets
import string
import time
import urllib.error
import urllib.parse
import urllib.request
from contextlib import suppress

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("SUPABASE_URL", "https://arlaxqmhtvjwjbjinjfw.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
APP_URL = os.environ.get("APP_URL", "http://127.0.0.1:4173/")
RUN_ID = os.environ.get("GITHUB_RUN_ID", "local")
EVIDENCE_PATH = os.environ.get("AUTH_EVIDENCE_PATH", "auth-browser-evidence.json")


def safe_error(exc):
    text = str(exc or "")
    return " ".join(text.split())[:240]


def request_json(method, path, body=None, expected=(200, 201, 204)):
    if not SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY_NOT_CONFIGURED")

    url = BASE_URL + path
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Accept": "application/json",
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, headers=headers, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8", errors="replace")
            payload = json.loads(raw) if raw else None
            if response.status not in expected:
                raise RuntimeError(f"HTTP_{response.status}")
            return response.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        detail = ""
        with suppress(Exception):
            parsed = json.loads(raw)
            detail = str(parsed.get("error_code") or parsed.get("msg") or parsed.get("message") or "")
        raise RuntimeError(f"HTTP_{exc.code}:{detail[:120]}") from exc


def admin_create_user(email, password):
    _, payload = request_json(
        "POST",
        "/auth/v1/admin/users",
        {
            "email": email,
            "password": password,
            "email_confirm": False,
            "user_metadata": {
                "name": "Velora Auth Evidence",
                "phone": None,
            },
        },
    )
    candidates = []
    if isinstance(payload, dict):
        candidates.append(payload.get("user"))
        candidates.append(payload)
        if isinstance(payload.get("data"), dict):
            candidates.append(payload.get("data"))
    uid = None
    for candidate in candidates:
        if isinstance(candidate, dict) and candidate.get("id"):
            uid = candidate["id"]
            break
    if not uid:
        raise RuntimeError("AUTH_FIXTURE_CREATE_NO_USER_ID")
    return uid


def delete_rows(table, uid):
    path = "/rest/v1/" + table + "?id=eq." + urllib.parse.quote(uid, safe="")
    try:
        request_json("DELETE", path, expected=(200, 204))
    except Exception as exc:
        # Cleanup is best-effort; the auth user delete below is still attempted.
        cleanup_errors.append(f"{table}:{safe_error(exc)}")


def admin_generate_link(kind, email):
    _, payload = request_json(
        "POST",
        "/auth/v1/admin/generate_link",
        {
            "type": kind,
            "email": email,
            "redirect_to": APP_URL,
        },
    )
    if not isinstance(payload, dict):
        raise RuntimeError(f"AUTH_{kind.upper()}_LINK_NO_RESPONSE")

    token_hash = payload.get("hashed_token")
    action_link = payload.get("action_link")
    if not token_hash and isinstance(payload.get("properties"), dict):
        token_hash = payload["properties"].get("hashed_token")
    if not action_link and isinstance(payload.get("properties"), dict):
        action_link = payload["properties"].get("action_link")

    if not token_hash:
        raise RuntimeError(f"AUTH_{kind.upper()}_LINK_NO_TOKEN_HASH")
    return token_hash, action_link


def admin_rows(table, uid, select):
    path = "/rest/v1/" + table + "?id=eq." + urllib.parse.quote(uid, safe="") + "&select=" + urllib.parse.quote(select, safe=",")
    _, payload = request_json("GET", path)
    return payload if isinstance(payload, list) else []


def admin_delete_user(uid):
    with suppress(Exception):
        request_json("DELETE", "/auth/v1/admin/users/" + urllib.parse.quote(uid, safe=""), expected=(200, 204))


def write_evidence(evidence):
    with open(EVIDENCE_PATH, "w", encoding="utf-8") as handle:
        json.dump(evidence, handle, ensure_ascii=False, indent=2)
    print(json.dumps(evidence, ensure_ascii=False, indent=2))


def wait_for_state(page, uid, timeout=30000):
    try:
        page.wait_for_function(
            """(uid) => STATE?.user?.uid === uid""",
            arg=uid,
            timeout=timeout,
        )
    except PlaywrightTimeoutError as exc:
        diagnostic = page.evaluate(
            """async () => {
                const snapshot = {
                    url: String(location.origin + location.pathname),
                    queryKeys: Array.from(new URLSearchParams(location.search).keys()),
                    hashKeys: Array.from(new URLSearchParams(String(location.hash || '').replace(/^#/, '')).keys()),
                    title: document.title || null,
                    stateUser: STATE?.user ? {
                        uid: STATE.user.uid || null,
                        email: STATE.user.email || null,
                        role: STATE.user.role || null
                    } : null,
                    authListenerRegistered: typeof __mahaAuthListenerRegistered !== 'undefined'
                        ? !!__mahaAuthListenerRegistered
                        : null
                };
                try {
                    const result = await window.mahaSupabase?.auth?.getSession?.();
                    snapshot.session = result?.data?.session ? {
                        present: true,
                        userId: result.data.session.user?.id || null,
                        email: result.data.session.user?.email || null
                    } : {present:false,userId:null,email:null};
                } catch (error) {
                    snapshot.session = {present:false,userId:null,email:null,errorCode:error?.code || null};
                }
                return snapshot;
            }"""
        )
        raise RuntimeError(
            "AUTH_STATE_HYDRATION_TIMEOUT:"
            + json.dumps(diagnostic, ensure_ascii=True, separators=(",", ":"))
        ) from exc


def session_snapshot(page):
    return page.evaluate(
        """async () => {
            const sb = window.mahaSupabase;
            if (!sb?.auth?.getSession) return {available:false, present:false, userId:null, email:null};
            const r = await sb.auth.getSession();
            const s = r?.data?.session;
            return {
                available:true,
                present:!!s,
                userId:s?.user?.id || null,
                email:s?.user?.email || null,
            };
        }"""
    )


def clean_page(page):
    page.goto(APP_URL, wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(500)


def open_account(page):
    page.locator("#accountBtn").click()
    page.locator("#accountContent").wait_for(timeout=10000)


def ui_logout(page):
    page.once("dialog", lambda dialog: dialog.accept())
    logout = page.locator("#accountContent button", has_text="Logout")
    if logout.count() == 0 or not logout.first.is_visible():
        open_account(page)
        logout = page.locator("#accountContent button", has_text="Logout")
    logout.click()
    page.wait_for_timeout(900)


cleanup_errors = []


def main():
    evidence = {
        "schema": "velora-auth-browser.v2",
        "execution_mode": "local_exact_source_ephemeral_fixture",
        "target_url": APP_URL,
        "fixture": {"ephemeral": True, "restore_test_only": True},
        "checks": {},
        "observations": {},
        "failures": [],
        "cleanup": {"attempted": False, "errors": []},
    }

    suffix = secrets.token_hex(8)
    email = f"velora-auth-e2e-{RUN_ID}-{suffix}@example.invalid"
    alphabet = string.ascii_letters + string.digits
    password = "V3lora!" + "".join(secrets.choice(alphabet) for _ in range(24))
    recovery_password = "V3loraRecovery!" + "".join(secrets.choice(alphabet) for _ in range(20))
    uid = None

    try:
        uid = admin_create_user(email, password)
        evidence["fixture"]["created"] = True

        # Reproduce the exact historical orphan state before confirmation.
        for table in ("user_roles", "profiles", "users"):
            delete_rows(table, uid)
        evidence["checks"]["orphan_fixture_prepared"] = (
            len(admin_rows("users", uid, "id")) == 0
            and len(admin_rows("profiles", uid, "id")) == 0
        )

        signup_hash, signup_action_link = admin_generate_link("signup", email)
        evidence["observations"]["signup_action_link_generated"] = bool(signup_action_link)
        evidence["observations"]["signup_token_hash_generated"] = bool(signup_hash)

        recovery_hash = None
        browser_errors = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            context = browser.new_context()
            page = context.new_page()
            page.on("pageerror", lambda exc: browser_errors.append("pageerror:" + safe_error(exc)))
            page.on("console", lambda msg: browser_errors.append("console:" + safe_error(msg.text)) if msg.type == "error" else None)
            page.on("response", lambda response: browser_errors.append(
                "response:" + str(response.status) + ":" + urllib.parse.urlsplit(response.url).path
            ) if response.status >= 400 else None)

            page.goto(APP_URL, wait_until="networkidle", timeout=60000)
            evidence["checks"]["http_200"] = page.locator("body").count() == 1
            evidence["checks"]["auth_client_available"] = bool(
                page.evaluate("() => !!window.mahaSupabase?.auth?.signInWithPassword")
            )

            # Before confirmation, password login must not establish a session.
            before_confirmation = page.evaluate(
                """async ({email, password}) => {
                    const sb = window.mahaSupabase;
                    const r = await sb.auth.signInWithPassword({email, password});
                    const s = await sb.auth.getSession();
                    return {
                        session: !!s?.data?.session,
                        errorCode: r?.error?.code || null
                    };
                }""",
                {"email": email, "password": password},
            )
            evidence["checks"]["unconfirmed_password_login_blocked"] = not bool(before_confirmation.get("session"))
            evidence["observations"]["unconfirmed_login_error_code"] = before_confirmation.get("errorCode")

            if not signup_action_link:
                raise RuntimeError("AUTH_SIGNUP_ACTION_LINK_MISSING")

            # A real email click opens a fresh document/client. Do not reuse the
            # pre-confirmation page because an existing Supabase client has already
            # completed its initial URL/session processing.
            confirmation_page = context.new_page()
            confirmation_page.on("pageerror", lambda exc: browser_errors.append("pageerror:" + safe_error(exc)))
            confirmation_page.on("console", lambda msg: browser_errors.append("console:" + safe_error(msg.text)) if msg.type == "error" else None)
            confirmation_page.on("response", lambda response: browser_errors.append(
                "response:" + str(response.status) + ":" + urllib.parse.urlsplit(response.url).path
            ) if response.status >= 400 else None)

            confirmation_page.goto(signup_action_link, wait_until="networkidle", timeout=60000)

            explicit_init_result = confirmation_page.evaluate(
                """async () => {
                    try {
                        if (typeof window.initializeSupabaseAuth !== 'function') return {available:false};
                        await window.initializeSupabaseAuth();
                        return {
                            available:true,
                            stateUserId: STATE?.user?.uid || null
                        };
                    } catch (error) {
                        return {
                            available:true,
                            errorCode:error?.code || null
                        };
                    }
                }"""
            )
            evidence["observations"]["explicit_init_result"] = explicit_init_result

            wait_for_state(confirmation_page, uid, timeout=30000)

            confirmation_snapshot = session_snapshot(confirmation_page)
            evidence["checks"]["email_confirmation_action_link_verifies"] = (
                confirmation_snapshot.get("present") and confirmation_snapshot.get("userId") == uid
            )
            evidence["observations"]["confirmation_final_path"] = (
                urllib.parse.urlsplit(confirmation_page.url).path
            )
            evidence["observations"]["confirmation_query_keys"] = sorted(
                urllib.parse.parse_qs(urllib.parse.urlsplit(confirmation_page.url).query).keys()
            )
            evidence["observations"]["confirmation_hash_keys"] = sorted(
                urllib.parse.parse_qs(urllib.parse.urlsplit(confirmation_page.url).fragment).keys()
            )
            page.close()
            page = confirmation_page

            rows_users = admin_rows("users", uid, "id,name,email,phone,role")
            rows_profiles = admin_rows("profiles", uid, "id")
            evidence["checks"]["post_confirmation_user_row_bootstrapped"] = len(rows_users) == 1
            evidence["checks"]["post_confirmation_profile_row_bootstrapped"] = len(rows_profiles) == 1

            snap = session_snapshot(page)
            evidence["checks"]["confirmed_session_present"] = snap.get("present") and snap.get("userId") == uid

            # Wrong-password negative path from the actual UI.
            ui_logout(page)
            clean_page(page)
            open_account(page)
            page.locator("#loginEmail").fill(email)
            page.locator("#loginPassword").fill("definitely-wrong-password")
            page.locator("#authFormContent form").evaluate("(f)=>f.requestSubmit()")
            page.wait_for_timeout(1200)
            wrong_after_confirm = session_snapshot(page)
            evidence["checks"]["invalid_password_no_session"] = not bool(wrong_after_confirm.get("present"))
            with suppress(Exception):
                page.locator("#authModal .modal-close").click()

            # Real successful UI login.
            clean_page(page)
            page._velora_uid = uid
            open_account(page)
            page.locator("#loginEmail").fill(email)
            page.locator("#loginPassword").fill(password)
            page.locator("#authFormContent form").evaluate("(f)=>f.requestSubmit()")
            wait_for_state(page, uid, timeout=30000)
            snap = session_snapshot(page)
            evidence["checks"]["valid_login_session"] = snap.get("present") and snap.get("userId") == uid
            evidence["checks"]["authenticated_user_matches_email"] = (
                str(snap.get("email") or "").lower() == email.lower()
            )
            evidence["checks"]["account_state_authenticated"] = (
                bool(page.evaluate("() => !!STATE?.user?.uid"))
            )

            # Refresh lifecycle: request a real token refresh and observe the session survives.
            refresh_result = page.evaluate(
                """async () => {
                    const events = [];
                    const { data, error } = await window.mahaSupabase.auth.getSession();
                    const { data: refreshData, error: refreshError } =
                        await window.mahaSupabase.auth.refreshSession();
                    return {
                        initialUserId: data?.session?.user?.id || null,
                        refreshedUserId: refreshData?.session?.user?.id || null,
                        initialPresent: !!data?.session,
                        refreshedPresent: !!refreshData?.session,
                        errorCode: refreshError?.code || error?.code || null
                    };
                }"""
            )
            evidence["checks"]["session_refresh_keeps_identity"] = (
                refresh_result.get("initialPresent")
                and refresh_result.get("refreshedPresent")
                and refresh_result.get("initialUserId") == uid
                and refresh_result.get("refreshedUserId") == uid
            )
            evidence["observations"]["refresh_error_code"] = refresh_result.get("errorCode")

            # UI logout.
            ui_logout(page)
            logged_out = session_snapshot(page)
            evidence["checks"]["logout_clears_session"] = not bool(logged_out.get("present"))
            evidence["checks"]["logout_clears_app_identity"] = not bool(
                page.evaluate("() => !!STATE?.user")
            )

            # Passwordless magic-link path is executed through the real generated magic-link action.
            magic_hash, magic_action_link = admin_generate_link("magiclink", email)
            evidence["observations"]["magiclink_action_link_generated"] = bool(magic_action_link)
            evidence["observations"]["magiclink_token_hash_generated"] = bool(magic_hash)
            if not magic_action_link:
                raise RuntimeError("AUTH_MAGICLINK_ACTION_LINK_MISSING")

            magic_page = context.new_page()
            magic_page.on("pageerror", lambda exc: browser_errors.append("pageerror:" + safe_error(exc)))
            magic_page.on("console", lambda msg: browser_errors.append("console:" + safe_error(msg.text)) if msg.type == "error" else None)
            magic_page.on("response", lambda response: browser_errors.append(
                "response:" + str(response.status) + ":" + urllib.parse.urlsplit(response.url).path
            ) if response.status >= 400 else None)
            magic_page.goto(magic_action_link, wait_until="networkidle", timeout=60000)
            wait_for_state(magic_page, uid, timeout=30000)
            magic_session = session_snapshot(magic_page)
            evidence["checks"]["magiclink_action_link_establishes_session"] = (
                magic_session.get("present") and magic_session.get("userId") == uid
            )
            evidence["observations"]["magiclink_final_path"] = urllib.parse.urlsplit(magic_page.url).path
            evidence["observations"]["magiclink_query_keys"] = sorted(
                urllib.parse.parse_qs(urllib.parse.urlsplit(magic_page.url).query).keys()
            )
            evidence["observations"]["magiclink_hash_keys"] = sorted(
                urllib.parse.parse_qs(urllib.parse.urlsplit(magic_page.url).fragment).keys()
            )
            ui_logout(magic_page)
            evidence["checks"]["magiclink_logout_clears_session"] = not bool(
                session_snapshot(magic_page).get("present")
            )
            magic_page.close()

            # Password recovery path is executed through the real generated recovery action link.
            recovery_hash, recovery_action_link = admin_generate_link("recovery", email)
            evidence["observations"]["recovery_action_link_generated"] = bool(recovery_action_link)
            evidence["observations"]["recovery_token_hash_generated"] = bool(recovery_hash)
            page = context.new_page()
            page.on("pageerror", lambda exc: browser_errors.append("pageerror:" + safe_error(exc)))
            page.on("console", lambda msg: browser_errors.append("console:" + safe_error(msg.text)) if msg.type == "error" else None)
            page.on("response", lambda response: browser_errors.append(
                "response:" + str(response.status) + ":" + urllib.parse.urlsplit(response.url).path
            ) if response.status >= 400 else None)
            if not recovery_action_link:
                raise RuntimeError("AUTH_RECOVERY_ACTION_LINK_MISSING")

            page.goto(recovery_action_link, wait_until="networkidle", timeout=60000)
            page.wait_for_function(
                "() => !!document.querySelector('#recoveryPassword')",
                timeout=30000,
            )
            recovery_session = session_snapshot(page)
            evidence["checks"]["recovery_action_link_establishes_session"] = (
                recovery_session.get("present") and recovery_session.get("userId") == uid
            )
            evidence["checks"]["password_recovery_ui_opened"] = bool(
                page.locator("#recoveryPassword").count() == 1
            )

            page.locator("#recoveryPassword").fill(recovery_password)
            page.locator("#recoveryPasswordConfirm").fill(recovery_password)
            page.locator("#authFormContent form").evaluate("(f)=>f.requestSubmit()")
            page.wait_for_timeout(1800)
            after_update = session_snapshot(page)
            evidence["checks"]["password_update_completes_and_clears_session"] = not bool(after_update.get("present"))

            # Login with the new password proves the password update took effect.
            clean_page(page)
            page._velora_uid = uid
            open_account(page)
            page.locator("#loginEmail").fill(email)
            page.locator("#loginPassword").fill(recovery_password)
            page.locator("#authFormContent form").evaluate("(f)=>f.requestSubmit()")
            wait_for_state(page, uid, timeout=30000)
            final_login = session_snapshot(page)
            evidence["checks"]["login_works_after_password_recovery"] = (
                final_login.get("present") and final_login.get("userId") == uid
            )

            # Final clean sign-out for fixture safety.
            ui_logout(page)
            final_logout = session_snapshot(page)
            evidence["checks"]["final_session_absent"] = not bool(final_logout.get("present"))

            context.close()
            browser.close()

    except PlaywrightTimeoutError as exc:
        evidence["failures"].append("browser_timeout:" + safe_error(exc))
    except Exception as exc:
        evidence["failures"].append("runner_error:" + safe_error(exc))
    finally:
        evidence["cleanup"]["attempted"] = True
        if uid:
            admin_delete_user(uid)
        evidence["cleanup"]["errors"] = list(cleanup_errors)

    evidence["observations"]["browser_errors"] = list(dict.fromkeys(browser_errors))[:20] if 'browser_errors' in locals() else []
    evidence["failures"] = list(evidence["failures"]) + [
        key for key, value in evidence["checks"].items() if value is not True
    ]

    # Deduplicate while preserving order.
    evidence["failures"] = list(dict.fromkeys(evidence["failures"]))
    evidence["cleanup"]["success"] = bool(uid) and not evidence["cleanup"]["errors"]

    write_evidence(evidence)
    raise SystemExit(1 if evidence["failures"] else 0)


if __name__ == "__main__":
    main()
