export type QrType = 'url' | 'text' | 'email' | 'wifi' | 'phone';

export interface QrInput {
	type: QrType;
	url?: string;
	text?: string;
	email?: string;
	phone?: string;
	wifiSsid?: string;
	wifiPass?: string;
	wifiEnc?: 'WPA' | 'WEP' | 'nopass';
}

export function buildQrContent(i: QrInput): string {
	if (i.type === 'url')   return i.url ?? '';
	if (i.type === 'text')  return i.text ?? '';
	if (i.type === 'email') return `mailto:${i.email ?? ''}`;
	if (i.type === 'phone') return `tel:${i.phone ?? ''}`;
	if (i.type === 'wifi')  return `WIFI:S:${i.wifiSsid ?? ''};T:${i.wifiEnc ?? 'WPA'};P:${i.wifiPass ?? ''};;`;
	return '';
}
