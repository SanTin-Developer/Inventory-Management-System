<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailChangeRequestedNotice extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $newEmail) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Email change requested on your account',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
                <div style=\"font-family: Arial, sans-serif; color: #10151F; max-width: 480px;\">
                    <h2 style=\"color:#2F5FEA;\">Email change requested</h2>
                    <p>A request was made to change the email address on your SMARTInventory account to:</p>
                    <p style=\"font-weight:bold;\">{$this->newEmail}</p>
                    <p>The change will only take effect once that new address is confirmed. This inbox will remain the account's email until then.</p>
                    <p style=\"font-size:13px; color:#B42318;\">If you didn't request this, please change your password immediately and contact support — someone else may have access to your account.</p>
                </div>
            ",
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
