<?php

namespace App\Services;

use Cloudinary\Cloudinary;

class CloudinaryImageService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        // Reads CLOUDINARY_URL directly from .env — no Laravel wrapper package needed.
        $this->cloudinary = new Cloudinary(env('CLOUDINARY_URL'));
    }

    /**
     * Upload an image file and return its secure URL.
     */
    public function upload($file, string $folder = 'users'): string
    {
        $result = $this->cloudinary->uploadApi()->upload($file->getRealPath(), [
            'folder' => $folder,
        ]);

        return $result['secure_url'];
    }

    /**
     * Delete a previously-uploaded image given its stored Cloudinary URL.
     * Safe to call with null/empty — does nothing in that case.
     */
    public function delete(?string $url, string $folder = 'users'): void
    {
        if (empty($url)) {
            return;
        }

        $publicId = $this->extractPublicId($url, $folder);

        if ($publicId) {
            $this->cloudinary->uploadApi()->destroy($publicId);
        }
    }

    /**
     * Pull the folder/filename (without extension) out of a Cloudinary URL
     * so it can be passed to destroy(). E.g.
     * https://res.cloudinary.com/xyz/image/upload/v123/users/abc123.jpg
     * -> "users/abc123"
     */
    protected function extractPublicId(string $url, string $folder): ?string
    {
        $pattern = '#/' . preg_quote($folder, '#') . '/([^/.]+)\.\w+$#';

        if (preg_match($pattern, $url, $matches)) {
            return $folder . '/' . $matches[1];
        }

        return null;
    }
}
