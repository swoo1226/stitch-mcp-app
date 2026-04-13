export default function GlobalLoading() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
      <div className="flex gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
