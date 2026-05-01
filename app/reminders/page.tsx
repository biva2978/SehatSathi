import Navbar from "@/components/Navbar";

export default function RemindersPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-400 px-5 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">Reminders ⏰</h1>
        <p className="text-blue-100 text-sm mt-1">Medicine, meal & water reminders</p>
      </div>
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div className="card text-center text-gray-400 py-12">
          <div className="text-4xl mb-3">🚧</div>
          <p className="font-medium">Coming in next step!</p>
          <p className="text-sm mt-1">Reminder settings will be built here.</p>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
