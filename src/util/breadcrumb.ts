import { prisma } from "../db/prisma.ts";

export async function getBreadcrumbs(folderId: number | null, userId: number) {
  const breadcrumbs: { id: number | null; name: string }[] = [];

  let currentFolderId = folderId;

  while (currentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: {
        id: currentFolderId,
        userId: userId,
      },
      select: { id: true, name: true, parentId: true },
    });

    if (!folder) break;

    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentFolderId = folder.parentId;
  }

  breadcrumbs.unshift({ id: null, name: "Home" });
  return breadcrumbs;
}
