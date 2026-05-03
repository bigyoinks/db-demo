const colors: Record<string, string> = {
  default: 'bg-orange-100 text-orange-800',
  Peanuts: 'bg-yellow-100 text-yellow-800',
  'Tree Nuts': 'bg-amber-100 text-amber-800',
  Gluten: 'bg-stone-100 text-stone-700',
  Dairy: 'bg-blue-100 text-blue-700',
  Eggs: 'bg-yellow-50 text-yellow-700',
  Shellfish: 'bg-red-100 text-red-700',
  Fish: 'bg-cyan-100 text-cyan-700',
  Soy: 'bg-lime-100 text-lime-700',
};

export default function AllergenBadge({ name }: { name: string }) {
  const cls = colors[name] ?? colors.default;
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {name}
    </span>
  );
}
