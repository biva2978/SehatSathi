import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-purple-500 to-pink-400 px-5 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">My Profile 👤</h1>
        <p className="text-purple-100 text-sm mt-1">Your health info & goals</p>
      </div>
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div className="card text-center text-gray-400 py-12">
          <div className="text-4xl mb-3">🚧</div>
          <p className="font-medium">Coming in next step!</p>
          <p className="text-sm mt-1">Profile setup form will be built here.</p>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
