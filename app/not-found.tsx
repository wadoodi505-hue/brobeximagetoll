export default function NotFound() {
      return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                  <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground mb-4">
                        Could not find the requested resource.
                  </p>
                  <a
                        href="/"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  >
                        Return Home
                  </a>
            </div>
      );
}
