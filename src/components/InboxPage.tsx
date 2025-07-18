const InboxPage = () => {
  return (
    <div className="flex-1 p-6 bg-background">
      <h1 className="text-2xl font-semibold text-foreground mb-8">Inbox</h1>
      
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-talo-green-light rounded-full flex items-center justify-center mb-6">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">Inbox cleared</h2>
        <p className="text-muted-foreground">You're all set.</p>
        <p className="text-muted-foreground">Enjoy the day!</p>
      </div>
    </div>
  );
};

export default InboxPage;