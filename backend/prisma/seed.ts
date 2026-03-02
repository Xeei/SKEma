import { PrismaClient, RoleLevel } from '@prisma/client';
import '../src/config/env';

const prisma = new PrismaClient();

const ROOT_FOLDERS = [
	{ name: 'ปี 1', description: 'เนื้อหาเรียนของวิชา ปี 1 ทั้งหมด' },
	{ name: 'ปี 2', description: 'เนื้อหาเรียนของวิชา ปี 2 ทั้งหมด' },
	{ name: 'ปี 3', description: 'เนื้อหาเรียนของวิชา ปี 3 ทั้งหมด' },
	{ name: 'ปี 4', description: 'เนื้อหาเรียนของวิชา ปี 4 ทั้งหมด' },
];

async function main() {
	// Upsert a system admin user to own root folders
	const systemUser = await prisma.user.upsert({
		where: { email: 'system@ske.internal' },
		update: {},
		create: {
			email: 'system@ske.internal',
			name: 'System',
			role: RoleLevel.ADMIN,
		},
	});

	console.log(`System user ready: ${systemUser.email}`);

	// Create root year folders if they don't already exist
	for (const folder of ROOT_FOLDERS) {
		const existing = await prisma.fileFolder.findFirst({
			where: {
				name: folder.name,
				parentId: null,
			},
		});

		if (!existing) {
			const created = await prisma.fileFolder.create({
				data: {
					name: folder.name,
					description: folder.description,
					userId: systemUser.id,
					parentId: null,
				},
			});
			console.log(`Created folder: ${created.name} (${created.id})`);
		} else {
			console.log(
				`Folder already exists: ${existing.name} (${existing.id})`
			);
		}
	}

	console.log('Seed complete.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
