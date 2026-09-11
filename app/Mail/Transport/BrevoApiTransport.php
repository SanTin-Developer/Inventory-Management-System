<?php

namespace App\Mail\Transport;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

class BrevoApiTransport extends AbstractTransport
{
    protected string $endpoint = 'https://api.brevo.com/v3/smtp/email';

    public function __construct(
        protected string $apiKey
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $envelope = $message->getEnvelope();

        $payload = $this->buildPayload($email, $envelope);

        try {
            $response = $this->client()->post($this->endpoint, $payload);

            if ($response->failed()) {
                throw new TransportException(
                    sprintf(
                        'Brevo API request failed with status %d. Response body: %s',
                        $response->status(),
                        $response->body()
                    )
                );
            }
        } catch (ConnectionException $exception) {
            throw new TransportException(
                sprintf(
                    'Could not reach Brevo API (%s). Reason: %s',
                    $this->endpoint,
                    $exception->getMessage()
                ),
                0,
                $exception
            );
        }

        $messageId = $response->json('messageId');

        if ($messageId !== null) {
            $email->getHeaders()->addHeader('X-Brevo-Message-Id', $messageId);
        }
    }

    protected function buildPayload(Email $email, Envelope $envelope): array
    {
        $sender = $envelope->getSender();

        $payload = [
            'sender' => [
                'name' => $sender->getName() ?: $sender->getAddress(),
                'email' => $sender->getAddress(),
            ],
            'to' => $this->stringifyAddresses($this->getRecipients($email, $envelope)),
            'subject' => $email->getSubject(),
        ];

        if (count($email->getCc()) > 0) {
            $payload['cc'] = $this->stringifyAddresses($email->getCc());
        }

        if (count($email->getBcc()) > 0) {
            $payload['bcc'] = $this->stringifyAddresses($email->getBcc());
        }

        if (count($email->getReplyTo()) > 0) {
            $firstReplyTo = $email->getReplyTo()[0];
            $payload['replyTo'] = [
                'name' => $firstReplyTo->getName() ?: $firstReplyTo->getAddress(),
                'email' => $firstReplyTo->getAddress(),
            ];
        }

        if ($html = $email->getHtmlBody()) {
            $payload['htmlContent'] = $html;
        }

        if ($text = $email->getTextBody()) {
            $payload['textContent'] = $text;
        }

        if ($headers = $this->buildCustomHeaders($email)) {
            $payload['headers'] = $headers;
        }

        if ($attachments = $this->buildAttachments($email)) {
            $payload['attachment'] = $attachments;
        }

        return $payload;
    }

    protected function getRecipients(Email $email, Envelope $envelope): array
    {
        $envelopeRecipients = $envelope->getRecipients();
        $ccAndBcc = array_merge($email->getCc(), $email->getBcc());

        return array_values(array_filter($envelopeRecipients, function (Address $address) use ($ccAndBcc) {
            return in_array($address, $ccAndBcc, true) === false;
        }));
    }

    protected function stringifyAddresses(array $addresses): array
    {
        return array_map(static function (Address $address) {
            return [
                'name' => $address->getName() ?: $address->getAddress(),
                'email' => $address->getAddress(),
            ];
        }, $addresses);
    }

    protected function buildCustomHeaders(Email $email): array
    {
        $headersToBypass = ['from', 'to', 'cc', 'bcc', 'reply-to', 'sender', 'subject', 'content-type'];

        $customHeaders = [];

        foreach ($email->getHeaders()->all() as $name => $header) {
            if (in_array($name, $headersToBypass, true)) {
                continue;
            }

            $customHeaders[$header->getName()] = $header->getBodyAsString();
        }

        return $customHeaders;
    }

    protected function buildAttachments(Email $email): array
    {
        $attachments = [];

        foreach ($email->getAttachments() as $attachment) {
            $headers = $attachment->getPreparedHeaders();
            $contentType = $headers->get('Content-Type')->getBody();
            $disposition = $headers->getHeaderBody('Content-Disposition');
            $filename = $headers->getHeaderParameter('Content-Disposition', 'filename');

            if ($contentType === 'text/calendar') {
                $content = $attachment->getBody();
            } else {
                $content = str_replace("\r\n", '', $attachment->bodyToString());
            }

            $item = [
                'name' => $filename,
                'content' => base64_encode($content),
            ];

            if ($disposition === 'inline' && $attachment->hasContentId()) {
                $item['contentId'] = $attachment->getContentId();
            }

            $attachments[] = $item;
        }

        return $attachments;
    }

    protected function client(): PendingRequest
    {
        return Http::baseUrl(rtrim($this->endpoint, '/'))
            ->withHeaders([
                'api-key' => $this->apiKey,
            ])
            ->acceptJson()
            ->asJson()
            ->retry(0)
            ->timeout(config('services.brevo.timeout', 30));
    }

    public function __toString(): string
    {
        return 'brevo';
    }
}