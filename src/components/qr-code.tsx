'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeProps {
    url: string;
    size?: number;
}

export function QRCode({ url, size = 128 }: QRCodeProps) {
    const downloadQRCode = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = 'qrcode.png';
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
                <QRCodeSVG
                    id="qr-code-svg"
                    value={url}
                    size={size}
                    level="H" // High error correction
                    includeMargin
                />
            </div>
            <Button variant="outline" size="sm" onClick={downloadQRCode} className="gap-2">
                <Download className="w-4 h-4" />
                Download PNG
            </Button>
        </div>
    );
}
