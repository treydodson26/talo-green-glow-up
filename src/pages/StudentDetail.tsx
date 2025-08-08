import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function StudentDetailPage() {
  const { id } = useParams();

  useEffect(() => {
    document.title = `Student ${id} | Talo`;
  }, [id]);

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight">Student Detail</h1>
      <p className="text-muted-foreground">Coming soon. ID: {id}</p>
    </div>
  );
}
