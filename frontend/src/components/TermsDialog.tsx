'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'ske_terms_accepted_v1';

interface TermsDialogProps {
	/** Controlled mode: open state managed by parent */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Whether to block closing (used for first-visit onboarding) */
	blocking?: boolean;
}

function TermsDialogCore({ open, onOpenChange, blocking = false }: TermsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={blocking ? () => {} : onOpenChange}>
			<DialogContent
				className="max-w-lg w-full"
				onPointerDownOutside={blocking ? (e) => e.preventDefault() : undefined}
				onEscapeKeyDown={blocking ? (e) => e.preventDefault() : undefined}
			>
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="w-10 h-10 bg-[#006837]/10 rounded-xl flex items-center justify-center shrink-0">
							<ShieldCheck className="w-5 h-5 text-[#006837]" />
						</div>
						<DialogTitle className="text-lg font-bold text-gray-800 leading-tight font-sarabun">
							ข้อตกลงการใช้งาน
							<span className="block text-sm font-medium text-gray-400 mt-0.5">
								Terms &amp; Conditions — SKE Schema
							</span>
						</DialogTitle>
					</div>
				</DialogHeader>

				<div className="h-72 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 leading-relaxed font-sarabun">
					<p className="mb-4 text-gray-500 text-xs uppercase tracking-wide font-semibold">
						โปรดอ่านและยอมรับก่อนใช้งาน
					</p>

					<Section title="1. วัตถุประสงค์ของแพลตฟอร์ม">
						SKE Schema จัดทำขึ้นเพื่อเป็นพื้นที่แบ่งปันเอกสาร โจทย์การบ้าน บันทึกย่อ
						และแหล่งเรียนรู้สำหรับนักศึกษาและสมาชิกในคณะวิชาวิศวกรรมซอฟต์แวร์และความรู้
						โดยมีจุดมุ่งหมายเพื่อส่งเสริมการเรียนรู้ร่วมกันในชุมชนวิชาการ
					</Section>

					<Section title="2. ความรับผิดชอบของผู้ใช้">
						ผู้ใช้ต้องรับผิดชอบต่อเนื้อหาที่ตนเองโพสต์ทั้งหมด รวมถึงไฟล์แนบ ลิงก์ และความคิดเห็น
						ห้ามโพสต์เนื้อหาที่ไม่เหมาะสม ผิดกฎหมาย หรือละเมิดสิทธิ์ผู้อื่น
					</Section>

					<Section title="3. ลิขสิทธิ์และทรัพย์สินทางปัญญา">
						ห้ามนำเอกสารหรือสื่อการสอนที่มีลิขสิทธิ์มาแบ่งปันโดยไม่ได้รับอนุญาต
						ผู้ที่อัปโหลดเนื้อหาถือว่ายืนยันว่าตนมีสิทธิ์เผยแพร่เนื้อหานั้น หากมีการละเมิดลิขสิทธิ์
						ผู้ดูแลระบบสงวนสิทธิ์ในการลบเนื้อหาดังกล่าวทันที
					</Section>

					<Section title="4. มารยาทของชุมชน">
						โปรดปฏิบัติต่อสมาชิกคนอื่นด้วยความเคารพและสุภาพ
						ห้ามโพสต์เนื้อหาที่มีเจตนาก่อความเดือดร้อน ล้อเลียน หรือโจมตีบุคคลอื่น
						ผู้ดูแลระบบมีสิทธิ์ระงับบัญชีผู้ใช้ที่ละเมิดมารยาทของชุมชน
					</Section>

					<Section title="5. การกลั่นกรองเนื้อหา">
						ผู้ดูแลระบบ (Admin) มีสิทธิ์แก้ไข ลบ หรือปฏิเสธโพสต์ใดก็ได้โดยไม่จำเป็นต้องแจ้งเหตุผล
						เพื่อรักษาคุณภาพและความเหมาะสมของเนื้อหาบนแพลตฟอร์ม
					</Section>

					<Section title="6. ข้อมูลส่วนบุคคล">
						ระบบจัดเก็บข้อมูลที่จำเป็นสำหรับการยืนยันตัวตน ได้แก่ ชื่อและอีเมล
						ข้อมูลดังกล่าวจะไม่ถูกเปิดเผยหรือขายให้บุคคลภายนอก
						และนำไปใช้เพื่อการให้บริการภายในแพลตฟอร์มเท่านั้น
					</Section>

					<Section title="7. การยอมรับข้อตกลง">
						การกดปุ่ม &ldquo;ยอมรับและเข้าใช้งาน&rdquo; ถือว่าท่านได้อ่าน เข้าใจ
						และยอมรับข้อตกลงการใช้งานทั้งหมดข้างต้นแล้ว หากไม่ยอมรับ
						ท่านจะไม่สามารถใช้งานแพลตฟอร์มนี้ได้
					</Section>
				</div>

				<DialogFooter className="mt-2">
					{blocking ? (
						<Button
							onClick={() => {
								localStorage.setItem(STORAGE_KEY, 'true');
								onOpenChange?.(false);
							}}
							className="w-full bg-[#006837] hover:bg-[#005028] text-white font-sarabun font-semibold"
						>
							ยอมรับและเข้าใช้งาน
						</Button>
					) : (
						<Button
							onClick={() => onOpenChange?.(false)}
							className="w-full bg-[#006837] hover:bg-[#005028] text-white font-sarabun font-semibold"
						>
							ปิด
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Auto-shows on first visit (blocking until accepted). Place in root page. */
export function TermsDialog() {
	const [open, setOpen] = useState(() => typeof window !== 'undefined' ? !localStorage.getItem(STORAGE_KEY) : false);

	return <TermsDialogCore open={open} onOpenChange={setOpen} blocking />;
}

/** A button that lets users re-read the terms at any time. Place in footer. */
export function TermsDialogButton() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="text-emerald-300 hover:text-white transition-colors text-xs underline underline-offset-2 font-sarabun"
			>
				ข้อตกลงการใช้งาน
			</button>
			<TermsDialogCore open={open} onOpenChange={setOpen} />
		</>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-4">
			<p className="font-semibold text-gray-800 mb-1">{title}</p>
			<p className="text-gray-600">{children}</p>
		</div>
	);
}
