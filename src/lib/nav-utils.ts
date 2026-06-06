export function isNavActive(currentPath: string, href: string): boolean {
  if (href === "/") {
    return currentPath === "/";
  }
  if (href === "/search") {
    return currentPath === "/search";
  }
  if (href === "/me") {
    return currentPath === "/me";
  }
  if (href === "/admin") {
    return currentPath === "/admin";
  }
  if (href === "/auth") {
    return currentPath === "/auth" || currentPath.startsWith("/auth/");
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function getPageTitle(path: string): string {
  const base = "同济大学乌龙茶替代品";
  if (path === "/") {
    return base;
  }
  if (path === "/search") {
    return `搜索 · ${base}`;
  }
  if (path.startsWith("/course/")) {
    return `课程详情 · ${base}`;
  }
  if (path.startsWith("/teacher/")) {
    return `教师主页 · ${base}`;
  }
  if (path.startsWith("/write-review/")) {
    return `写评论 · ${base}`;
  }
  if (path === "/auth") {
    return `登录 · ${base}`;
  }
  if (path === "/me") {
    return `我的评论 · ${base}`;
  }
  if (path === "/admin") {
    return `管理后台 · ${base}`;
  }
  return base;
}
