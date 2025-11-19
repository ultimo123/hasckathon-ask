import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type JobListing = {
  id: number;
  title: string;
  description: string;
  developersNeeded: number;
  experienceYears: number;
  skills: string[];
  categories: string[];
};

type JobListingsProps = {
  jobs: JobListing[];
};

export function JobListings({ jobs }: JobListingsProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Job Openings</h1>
        <p className="text-muted-foreground">
          Find the perfect opportunity for your team
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Link
            href={`/project/${job.id}`}
            key={job.id}
            className="block"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {job.categories.map((category) => (
                        <Badge
                          key={category}
                          variant="outline"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm leading-relaxed">
                  {job.description}
                </CardDescription>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Developers:</span>
                    <span>{job.developersNeeded}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Experience:</span>
                    <span>{job.experienceYears}+ years</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
