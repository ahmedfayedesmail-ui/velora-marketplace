-- VELORA — Checkout localization catalog
-- Restore-Test / source-of-truth migration.
-- No schema changes. Production remains FROZEN.

with translations(key, source_text, translated_text) as (
  values
    ('Shipping Information','Shipping Information','معلومات الشحن'),
    ('Full Name','Full Name','الاسم الكامل'),
    ('Phone','Phone','الهاتف'),
    ('Email','Email','البريد الإلكتروني'),
    ('Country / Region','Country / Region','الدولة / المنطقة'),
    ('Select country','Select country','اختر الدولة'),
    ('Loading countries…','Loading countries…','جارٍ تحميل الدول…'),
    ('Egypt','Egypt','مصر'),
    ('City','City','المدينة'),
    ('Address','Address','العنوان'),
    ('Notes (optional)','Notes (optional)','ملاحظات (اختياري)'),
    ('Payment Method','Payment Method','طريقة الدفع'),
    ('Card','Card','بطاقة'),
    ('Card payment','Card payment','الدفع بالبطاقة'),
    ('Cash on Delivery','Cash on Delivery','الدفع عند الاستلام'),
    ('Pay when you receive','Pay when you receive','الدفع عند الاستلام'),
    ('Summary','Summary','ملخص الطلب'),
    ('Qty','Qty','الكمية'),
    ('Place Order','Place Order','إتمام الطلب'),
    ('Loading checkout','Loading checkout','جارٍ تحميل الدفع'),
    ('Syncing your cart…','Syncing your cart…','جارٍ مزامنة سلة التسوق…'),
    ('Preparing your order summary…','Preparing your order summary…','جارٍ تجهيز ملخص طلبك…'),
    ('Free','Free','مجانًا'),
    ('Please complete your shipping information','Please complete your shipping information','يرجى استكمال بيانات الشحن'),
    ('Payment method is required','Payment method is required','يجب اختيار طريقة الدفع'),
    ('No operational payment method is currently available.','No operational payment method is currently available.','لا توجد طريقة دفع متاحة حاليًا.'),
    ('Shipping quote unavailable.','Shipping quote unavailable.','تعذر احتساب تكلفة الشحن حاليًا.'),
    ('Shipping quote ready.','Shipping quote ready.','تم احتساب تكلفة الشحن.'),
    ('Shipping configuration required for one or more sellers.','Shipping configuration required for one or more sellers.','تحتاج إعدادات الشحن لبعض المتاجر.'),
    ('Gift card','Gift card','بطاقة هدايا'),
    ('Gift card code','Gift card code','رمز بطاقة الهدايا'),
    ('Gift card applied:','Gift card applied:','تم تطبيق بطاقة الهدايا:'),
    ('Remaining:','Remaining:','المتبقي:'),
    ('Gift card removed.','Gift card removed.','تمت إزالة بطاقة الهدايا.')
)
insert into public.velora_i18n_keys(key,source_text,category,is_active,updated_at)
select key,source_text,'ui',true,now()
from translations
on conflict(key) do update
set source_text=excluded.source_text,
    category=excluded.category,
    is_active=true,
    updated_at=now();

with translations(key, translated_text) as (
  values
    ('Shipping Information','معلومات الشحن'),
    ('Full Name','الاسم الكامل'),
    ('Phone','الهاتف'),
    ('Email','البريد الإلكتروني'),
    ('Country / Region','الدولة / المنطقة'),
    ('Select country','اختر الدولة'),
    ('Loading countries…','جارٍ تحميل الدول…'),
    ('Egypt','مصر'),
    ('City','المدينة'),
    ('Address','العنوان'),
    ('Notes (optional)','ملاحظات (اختياري)'),
    ('Payment Method','طريقة الدفع'),
    ('Card','بطاقة'),
    ('Card payment','الدفع بالبطاقة'),
    ('Cash on Delivery','الدفع عند الاستلام'),
    ('Pay when you receive','الدفع عند الاستلام'),
    ('Summary','ملخص الطلب'),
    ('Qty','الكمية'),
    ('Place Order','إتمام الطلب'),
    ('Loading checkout','جارٍ تحميل الدفع'),
    ('Syncing your cart…','جارٍ مزامنة سلة التسوق…'),
    ('Preparing your order summary…','جارٍ تجهيز ملخص طلبك…'),
    ('Free','مجانًا'),
    ('Please complete your shipping information','يرجى استكمال بيانات الشحن'),
    ('Payment method is required','يجب اختيار طريقة الدفع'),
    ('No operational payment method is currently available.','لا توجد طريقة دفع متاحة حاليًا.'),
    ('Shipping quote unavailable.','تعذر احتساب تكلفة الشحن حاليًا.'),
    ('Shipping quote ready.','تم احتساب تكلفة الشحن.'),
    ('Shipping configuration required for one or more sellers.','تحتاج إعدادات الشحن لبعض المتاجر.'),
    ('Gift card','بطاقة هدايا'),
    ('Gift card code','رمز بطاقة الهدايا'),
    ('Gift card applied:','تم تطبيق بطاقة الهدايا:'),
    ('Remaining:','المتبقي:'),
    ('Gift card removed.','تمت إزالة بطاقة الهدايا.')
)
insert into public.velora_i18n_translations(key,locale,translated_text,is_machine_generated,is_reviewed,updated_at)
select key,'ar',translated_text,false,true,now()
from translations
on conflict(key,locale) do update
set translated_text=excluded.translated_text,
    is_machine_generated=false,
    is_reviewed=true,
    updated_at=now();
