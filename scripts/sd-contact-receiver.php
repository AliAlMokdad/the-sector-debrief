<?php
/**
 * sd-contact-receiver.php
 *
 * Small PHP receiver for The Sector Debrief contact form. Lives on Ali's
 * Namecheap cPanel hosting (NOT GitHub Pages). Receives POST submissions
 * from the static site, validates them, and sends an email to the
 * configured recipient via the cPanel SMTP server — the same authenticated
 * mail path Ali's WordPress sites (alialmokdadleadership.com, alialmokdad.com)
 * use via Fluent Forms.
 *
 * DEPLOY (Ali's hands, ~2 minutes via cPanel File Manager):
 *
 *   1. Log in to Namecheap → Hosting List → GO TO CPANEL.
 *   2. Open File Manager.
 *   3. Pick any domain you own that's on cPanel (e.g. smallccut.org under
 *      public_html, or alialmokdadleadership.com/, or quantumhumanitarian.ink/).
 *      The file needs to be reachable via HTTPS from a domain that resolves
 *      to your cPanel server.
 *   4. Upload this file as `sd-contact-receiver.php` to the public_html
 *      (or domain root) folder of the chosen domain.
 *   5. Verify it works: visit https://<chosen-domain>/sd-contact-receiver.php
 *      in a browser. You should see {"ok":false,"error":"method_not_allowed"}
 *      — that confirms the file is live and PHP is executing.
 *   6. Send Claude the chosen domain so the JS fetch URL on thesectordebrief.com
 *      can be updated to point at it (e.g. https://smallccut.org/sd-contact-receiver.php).
 *
 * The form on the live site already has the right field names matching this
 * receiver. Once the file is up + the JS URL updated, contact submissions
 * deliver to Ali's Gmail through Namecheap SMTP — no FormSubmit activation
 * ever needed, no third-party relay, same path the WordPress forms use.
 */

// CORS: allow POSTs from the live site origin only.
$allowed_origins = [
    'https://thesectordebrief.com',
    'https://www.thesectordebrief.com',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');

// Preflight: short-circuit OPTIONS requests.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only POST is allowed for actual submissions.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

// Read JSON or form-encoded body.
$raw = file_get_contents('php://input');
$ct  = $_SERVER['CONTENT_TYPE'] ?? '';
$data = [];
if (stripos($ct, 'application/json') !== false) {
    $data = json_decode($raw, true) ?: [];
} else {
    $data = $_POST;
}

// Honeypot: if the hidden field is filled, drop silently as success
// (so bots don't get useful feedback).
if (!empty($data['_honey'])) {
    echo json_encode(['ok' => true, 'queued' => true]);
    exit;
}

// Required fields.
$name    = trim((string)($data['name']    ?? ''));
$email   = trim((string)($data['email']   ?? ''));
$type    = trim((string)($data['type']    ?? ''));
$message = trim((string)($data['message'] ?? ''));
$org     = trim((string)($data['organization'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_fields']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bad_email']);
    exit;
}
// Sanity-cap message length.
if (strlen($message) > 8000) {
    $message = substr($message, 0, 8000) . "\n... [truncated]";
}

// Destination + sender. Sender uses a no-reply at the receiver domain so
// the email passes SPF/DKIM/DMARC on Namecheap's mail server.
$to            = 'almokdadali1@gmail.com';
$from_domain   = $_SERVER['HTTP_HOST'] ?? 'mailer.local';
$from_address  = 'no-reply@' . preg_replace('/^www\./', '', $from_domain);
$subject       = 'New Sector Debrief contact form submission';

// Plain-text body — keep it readable in Gmail's preview pane.
$body  = "New contact form submission from thesectordebrief.com\n";
$body .= str_repeat('=', 60) . "\n\n";
$body .= "Name:         {$name}\n";
$body .= "Email:        {$email}\n";
if ($org !== '')  $body .= "Organisation: {$org}\n";
if ($type !== '') $body .= "Type:         {$type}\n";
$body .= "\nMessage:\n";
$body .= str_repeat('-', 60) . "\n";
$body .= $message . "\n";
$body .= str_repeat('-', 60) . "\n\n";
$body .= "Submitted at: " . gmdate('Y-m-d H:i:s') . " UTC\n";
$body .= "Origin:       " . ($origin ?: 'unknown') . "\n";

// Headers. Reply-To = the visitor so Ali can reply directly from Gmail.
$headers   = [];
$headers[] = "From: The Sector Debrief <{$from_address}>";
$headers[] = "Reply-To: {$name} <{$email}>";
$headers[] = "X-Mailer: sd-contact-receiver.php";
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=UTF-8";

$ok = @mail($to, $subject, $body, implode("\r\n", $headers), "-f {$from_address}");

if (!$ok) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail_failed']);
    exit;
}

echo json_encode(['ok' => true, 'queued' => true]);
