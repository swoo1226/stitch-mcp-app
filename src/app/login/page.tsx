import LoginPageClient from "./LoginPageClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const redirectParam = params.redirect;
  const redirectTo = typeof redirectParam === "string" && redirectParam.length > 0
    ? redirectParam
    : "";

  return <LoginPageClient redirectTo={redirectTo} />;
}
