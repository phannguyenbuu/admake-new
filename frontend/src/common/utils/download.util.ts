export function downloadFromBlob(res: any, fallback = "baogia.xlsx") {
  const cd: string = res.headers?.["content-disposition"] || "";
  const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
  const filename = m ? decodeURIComponent(m[1].replace(/['"]/g, "")) : fallback;

  const blob = new Blob([res], {
    type: res.headers?.["content-type"] || "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
