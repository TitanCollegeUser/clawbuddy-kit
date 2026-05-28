interface Props {
  title: string;
  icon: string;
  description: string;
}

export function SalsaPlaceholderPage({ title, icon, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-white/40 max-w-xs">{description}</p>
    </div>
  );
}
