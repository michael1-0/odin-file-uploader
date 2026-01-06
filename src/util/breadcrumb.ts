import {prisma} from "../db/prisma.ts";

export async function getBreadcrumbs(folderId: number | null) {
  const breadcrumbs: { id: number | null; name: string }[] = [];
  
  let currentFolderId = folderId;
  
  while (currentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      select: { id: true, name: true, parentId: true }
    });
    
    if (!folder) break;
    
    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentFolderId = folder.parentId;
  }
  
  // Add root
  breadcrumbs.unshift({ id: null, name: "Home" });
  
  return breadcrumbs;
}