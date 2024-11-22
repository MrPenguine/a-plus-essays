import { Card } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";

interface AssignmentDetailsCardProps {
  subject: string;
  level: string;
  assignment_type: string;
  pages: number;
  wordcount: number;
  deadline: string;
}

export function AssignmentDetailsCard({
  subject,
  level,
  assignment_type,
  pages,
  wordcount,
  deadline
}: AssignmentDetailsCardProps) {
  const formatDeadline = (dateString: string) => {
    try {
      // First try parsing as ISO string
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, "MMM d, yyyy h:mm a");
      }

      // If not ISO, try as regular date
      const regularDate = new Date(dateString);
      if (isValid(regularDate)) {
        return format(regularDate, "MMM d, yyyy h:mm a");
      }

      // If both fail, return the original string
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Subject</p>
          <p className="font-medium">{subject}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="font-medium">{level}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-medium">{assignment_type}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pages</p>
          <p className="font-medium">{pages}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Word Count</p>
          <p className="font-medium">{wordcount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Deadline</p>
          <p className="font-medium">{formatDeadline(deadline)}</p>
        </div>
      </div>
    </Card>
  );
} 