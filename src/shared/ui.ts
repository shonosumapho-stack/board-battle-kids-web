export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function clearChildren(parent: HTMLElement): void {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
}

export function labeledSelect(
  label: string,
  options: string[],
  selectedIndex: number,
  onChange?: () => void,
): { wrap: HTMLDivElement; select: HTMLSelectElement } {
  const wrap = el('div', 'field');
  const lab = el('label', 'field-label', label);
  const select = el('select', 'level-select') as HTMLSelectElement;
  for (const opt of options) {
    const o = el('option', undefined, opt) as HTMLOptionElement;
    o.value = opt;
    select.appendChild(o);
  }
  select.selectedIndex = Math.max(0, Math.min(options.length - 1, selectedIndex));
  if (onChange) select.addEventListener('change', onChange);
  wrap.append(lab, select);
  return { wrap, select };
}

export function playQuery(params: Record<string, string>): string {
  const q = new URLSearchParams(params).toString();
  return q ? `?${q}` : '';
}
