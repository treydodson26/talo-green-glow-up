import { useEffect } from "react";
import { useStudents } from "@/hooks/use-students";
import { StudentsGrid } from "@/components/students/StudentsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function setSEO() {
  document.title = "Students Gallery | Talo";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    const m = document.createElement("meta");
    m.name = "description";
    m.content = "Students Gallery with search and filters for Talo yoga studio";
    document.head.appendChild(m);
  } else {
    metaDesc.setAttribute("content", "Students Gallery with search and filters for Talo yoga studio");
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    const l = document.createElement("link");
    l.rel = "canonical";
    l.href = window.location.href;
    document.head.appendChild(l);
  }
}

export default function StudentsPage() {
  const { toast } = useToast();
  const { data, isLoading, error } = useStudents();

  useEffect(() => {
    setSEO();
  }, []);

  useEffect(() => {
    if (error) {
      toast({ title: "Failed to load students", description: String(error?.message ?? error), variant: "destructive" as any });
      console.error("StudentsPage error", { error });
    }
  }, [error]);

  useEffect(() => {
    if (data?.usedMockData) {
      toast({ title: "Showing sample students", description: "The students table is empty. Using mock data for preview.", });
    }
  }, [data?.usedMockData]);

  return (
    <div className="container max-w-7xl py-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Students Gallery</h1>
        <p className="text-muted-foreground">Search, filter, and explore your studio's students.</p>
      </header>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <StudentsGrid students={data?.students ?? []} />
        </div>
      )}
    </div>
  );
}
