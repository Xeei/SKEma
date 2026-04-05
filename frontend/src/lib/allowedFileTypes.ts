export const ALLOWED_MIME_TYPES = new Set([
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/zip',
	'application/x-zip-compressed',
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'text/plain',
	'text/x-python',
	'text/x-python-script',
	'application/x-python-code',
	'text/csv',
	'text/x-c',
	'text/x-csrc',
	'text/x-chdr',
	'text/x-c++src',
	'text/x-c++hdr',
	'text/x-asm',
	'text/x-assembler',
	'application/xml',
	'text/xml',
]);

export const ALLOWED_EXTENSIONS =
	'.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.gif,.webp,.txt,.py,.csv,.c,.h,.cpp,.asm,.s,.xml';

export function isAllowedFileType(file: File): boolean {
	return ALLOWED_MIME_TYPES.has(file.type);
}
