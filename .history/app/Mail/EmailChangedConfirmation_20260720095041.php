<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailChangedConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your account email has been changed',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
                <div style=\"font-family: Arial, sans-serif; color: #10151F; max-width: 480px;\">
                    <h2 style=\"color:#2F5FEA;\">Your email address has been changed</h2>
                    <p>The email address on your SMARTInventory account was successfully updated to a new address.</p>
                    <p>All active sessions were signed out for security — you'll need to log in again with your new email.</p>
                    <p style=\"font-size:13px; color:#B42318;\">If you didn't make this change, contact support immediately.</p>
                </div>
            ",
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
