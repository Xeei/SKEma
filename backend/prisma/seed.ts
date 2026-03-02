import { PrismaClient, RoleLevel } from '@prisma/client';
import '../src/config/env';

const prisma = new PrismaClient();

const ROOT_FOLDERS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];

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
	for (const folderName of ROOT_FOLDERS) {
		const existing = await prisma.fileFolder.findFirst({
			where: {
				name: folderName,
				parentId: null,
			},
		});

		if (!existing) {
			const folder = await prisma.fileFolder.create({
				data: {
					name: folderName,
					userId: systemUser.id,
					parentId: null,
				},
			});
			console.log(`Created folder: ${folder.name} (${folder.id})`);
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
