<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConfirmNewEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $token) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirm your new email address',
        );
    }

    public function content(): Content
    {
        $url = rtrim(config('app.frontend_url', env('FRONTEND_URL', '')), '/')
            . '/email/confirm/' . $this->token;

        return new Content(
            htmlString: "
                <div style=\"font-family: Arial, sans-serif; color: #10151F; max-width: 480px;\">
                    <h2 style=\"color:#2F5FEA;\">Confirm your new email address</h2>
                    <p>You (or someone using your account) requested to change the email address on your SMARTInventory account to this address.</p>
                    <p>
                        <a href=\"{$url}\" style=\"display:inline-block; background:#2F5FEA; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;\">
                            Confirm new email
                        </a>
                    </p>
                    <p style=\"font-size:13px; color:#6B7280;\">Or copy this link into your browser:<br>{$url}</p>
                    <p style=\"font-size:13px; color:#6B7280;\">This link expires in 24 hours. If you didn't request this change, you can safely ignore this email — no changes will be made.</p>
                </div>
            ",
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
