<?php
/**
 * IRKUTSK ELITE — Professional Form Handler
 * Версия: 3.0 (Production Ready)
 * Защита: Honeypot + Time Token + Referer Check
 * Проект: irkutsk-elite.ru
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// === КОНФИГУРАЦИЯ ===
define('DEMO_MODE', false);
define('ADMIN_EMAIL', 'admin@irkutsk-elite.ru');
define('SITE_DOMAIN', 'irkutsk-elite.ru');
define('MIN_SUBMIT_TIME', 3);
define('MAX_NAME_LENGTH', 50);
define('MIN_NAME_LENGTH', 2);

// === ОТКЛЮЧАЕМ ВЫВОД ОШИБОК В ПРОДАКШЕНЕ ===
if (!DEMO_MODE) {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// === ПРОВЕРКА МЕТОДА ===
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Метод не поддерживается. Используйте POST.']);
    exit;
}

// === ПРОВЕРКА CONTENT-TYPE ===
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'multipart/form-data') === false && strpos($contentType, 'application/x-www-form-urlencoded') === false) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Неверный формат данных.']);
    exit;
}

// === 1. HONEYPOT ПРОВЕРКА ===
if (!empty($_POST['website']) || !empty($_POST['url']) || !empty($_POST['company'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Обнаружена подозрительная активность.']);
    exit;
}

// === 2. TIME TOKEN ПРОВЕРКА ===
$formTime = isset($_POST['form_time']) ? (int)$_POST['form_time'] : 0;
$currentTime = time();
if ($formTime === 0 || ($currentTime - $formTime) < MIN_SUBMIT_TIME) {
    http_response_code(429);
    echo json_encode(['status' => 'error', 'message' => 'Пожалуйста, подождите несколько секунд перед повторной отправкой.']);
    exit;
}
if (($currentTime - $formTime) > 3600) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Форма устарела. Пожалуйста, обновите страницу.']);
    exit;
}

// === 3. REFERER CHECK ===
$referer = $_SERVER['HTTP_REFERER'] ?? '';
if (!DEMO_MODE && !empty($referer)) {
    if (strpos($referer, SITE_DOMAIN) === false) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Доступ запрещён.']);
        exit;
    }
}

// === ПОЛУЧЕНИЕ ДАННЫХ ===
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$formType = isset($_POST['form_type']) ? trim($_POST['form_type']) : 'general';

// === ВАЛИДАЦИЯ ИМЕНИ ===
if (empty($name)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Пожалуйста, введите ваше имя.']);
    exit;
}
if (mb_strlen($name) < MIN_NAME_LENGTH) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Имя должно содержать минимум ' . MIN_NAME_LENGTH . ' символа.']);
    exit;
}
if (mb_strlen($name) > MAX_NAME_LENGTH) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Имя слишком длинное (максимум ' . MAX_NAME_LENGTH . ' символов).']);
    exit;
}
if (!preg_match('/^[\p{L}\s\-]+$/u', $name)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Имя может содержать только буквы, пробелы и дефисы.']);
    exit;
}

// === ВАЛИДАЦИЯ ТЕЛЕФОНА ===
if (empty($phone)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Пожалуйста, введите номер телефона.']);
    exit;
}
$phoneClean = preg_replace('/[^\d+]/', '', $phone);
if (!preg_match('/^(\+7|8)\d{10}$/', $phoneClean)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Пожалуйста, введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX.']);
    exit;
}

// === ФОРМАТИРОВАНИЕ ТЕЛЕФОНА ===
$phoneFormatted = $phoneClean;
if (strpos($phoneClean, '8') === 0 && strlen($phoneClean) === 11) {
    $phoneFormatted = '+7' . substr($phoneClean, 1);
}

// === ПОДГОТОВКА ПИСЬМА ===
$to = ADMIN_EMAIL;
$subject = '=?UTF-8?B?' . base64_encode('Новая заявка с сайта IRKUTSK ELITE') . '?=';

$dateTime = date('d.m.Y H:i:s');
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

// HTML-письмо
$messageHtml = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; background: #fdf8f8; }
        .header { border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #C5A059; font-size: 24px; margin: 0; font-weight: 300; }
        .field { margin-bottom: 20px; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; margin-bottom: 5px; }
        .value { font-size: 16px; font-weight: 500; color: #1A1A1A; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E2E1; font-size: 12px; color: #555555; }
        .badge { display: inline-block; padding: 4px 12px; background: #C5A059; color: white; border-radius: 2px; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>IRKUTSK ELITE</h1>
            <p style='margin: 5px 0 0 0; color: #555555;'>Новая заявка с сайта</p>
        </div>
        
        <div class='field'>
            <div class='label'>Имя клиента</div>
            <div class='value'>" . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</div>
        </div>
        
        <div class='field'>
            <div class='label'>Телефон</div>
            <div class='value'>" . htmlspecialchars($phoneFormatted, ENT_QUOTES, 'UTF-8') . "</div>
        </div>
        
        <div class='field'>
            <div class='label'>Тип формы</div>
            <div class='value'><span class='badge'>" . htmlspecialchars($formType, ENT_QUOTES, 'UTF-8') . "</span></div>
        </div>
        
        <div class='footer'>
            <p><strong>Дата и время:</strong> " . $dateTime . "</p>
            <p><strong>IP адрес:</strong> " . htmlspecialchars($ipAddress, ENT_QUOTES, 'UTF-8') . "</p>
            <p><strong>Браузер:</strong> " . htmlspecialchars($userAgent, ENT_QUOTES, 'UTF-8') . "</p>
        </div>
    </div>
</body>
</html>
";

// Текстовая версия
$messageText = "IRKUTSK ELITE — Новая заявка\n";
$messageText .= "============================\n\n";
$messageText .= "Имя: " . $name . "\n";
$messageText .= "Телефон: " . $phoneFormatted . "\n";
$messageText .= "Тип формы: " . $formType . "\n\n";
$messageText .= "Дата: " . $dateTime . "\n";
$messageText .= "IP: " . $ipAddress . "\n";

// === ЗАГОЛОВКИ ПИСЬМА ===
$boundary = md5(time());
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
$headers .= "From: =?UTF-8?B?" . base64_encode('IRKUTSK ELITE') . "?= <noreply@" . SITE_DOMAIN . ">\r\n";
$headers .= "Reply-To: " . ADMIN_EMAIL . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 1\r\n";

// === ТЕЛО ПИСЬМА ===
$body = "--{$boundary}\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= $messageText . "\r\n\r\n";
$body .= "--{$boundary}\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= $messageHtml . "\r\n\r\n";
$body .= "--{$boundary}--\r\n";

// === ОТПРАВКА ===
if (DEMO_MODE) {
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'DEMO MODE: Заявка принята (письмо не отправлено).',
        'data' => [
            'name' => $name,
            'phone' => $phoneFormatted,
            'form_type' => $formType
        ]
    ]);
    exit;
}

$mailSent = @mail($to, $subject, $body, $headers);

if ($mailSent) {
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Заявка успешно отправлена! Мы перезвоним вам в течение 5 минут.'
    ]);
} else {
    error_log('IRKUTSK ELITE: Failed to send email to ' . $to);
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Ошибка при отправке. Пожалуйста, позвоните нам напрямую: +7 (3952) 00-00-00.'
    ]);
}
?>