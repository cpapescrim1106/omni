import { PatientIntakeForm } from "@/components/patient-intake-form";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <PatientIntakeForm initialQuery={resolvedSearchParams?.query} />;
}
