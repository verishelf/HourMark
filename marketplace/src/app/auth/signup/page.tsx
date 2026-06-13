export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-3 text-muted">Use the Crownly iOS app to register, or contact support.</p>
      <a href="/auth/login" className="mt-6 inline-block text-sm text-gold hover:underline">
        Back to sign in
      </a>
    </div>
  );
}
