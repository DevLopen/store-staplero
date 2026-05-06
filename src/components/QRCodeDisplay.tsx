import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
    value: string;
    size?: number;
}

const QRCodeDisplay = ({ value, size = 160 }: QRCodeDisplayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const render = async () => {
            try {
                // @ts-ignore
                const QRCode = (await import("qrcode")).default;
                if (canvasRef.current) {
                    await QRCode.toCanvas(canvasRef.current, value, {
                        width: size,
                        margin: 2,
                        color: { dark: "#0f172a", light: "#ffffff" },
                    });
                }
            } catch (err) {
                console.error("QR render error:", err);
            }
        };
        render();
    }, [value, size]);

    return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
};

export default QRCodeDisplay;