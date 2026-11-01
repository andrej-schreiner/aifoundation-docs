// The Telekom icon set from Scale (src/assets/icons/scale/<category>/<name>/
// {default,selected}.svg), keyed as `<category>-<name>/<variant>` with
// Scale's names: category `user_file` becomes `user-file`.
const raw = import.meta.glob('../../assets/icons/scale/*/*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const urls = import.meta.glob('../../assets/icons/scale/*/*/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function key(path: string): string {
  const [category, name, file] = path.split('/').slice(-3);
  return `${category.replace(/_/g, '-')}-${name}/${file.replace('.svg', '')}`;
}

/** SVG source per icon and variant, for inline use. */
export const iconSvgs: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([path, svg]) => [key(path), svg]),
);

/** File URL per icon and variant, for CSS masks (the design-system gallery). */
export const iconUrls: Record<string, string> = Object.fromEntries(
  Object.entries(urls).map(([path, url]) => [key(path), url]),
);

/** All icons by category, for listings: { action: ['action-add', …], … }. */
export const iconCategories: Record<string, string[]> = Object.keys(raw).reduce(
  (acc, path) => {
    const [category, name] = path.split('/').slice(-3);
    const cat = category.replace(/_/g, '-');
    const id = `${cat}-${name}`;
    if (!acc[cat]?.includes(id)) (acc[cat] ??= []).push(id);
    return acc;
  },
  {} as Record<string, string[]>,
);
