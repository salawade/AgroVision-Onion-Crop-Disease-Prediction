import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
} from "../services/profileApi";

export default function Profile() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    village: "",
    mobile: "",
    profile_image: "",
    total_scans: 0,
    joined: "",
  });

  const [edit, setEdit] = useState(false);

  // Redirect if user is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await getProfile(user.id);
      setProfile(data);
    } catch (err) {
      console.log(err);
    }
  };

  const save = async () => {
    try {
      await updateProfile(user.id, profile);
      setEdit(false);
      alert("Profile Updated Successfully");
      loadProfile();
    } catch (err) {
      alert("Unable to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-50 to-yellow-50 py-10 px-4">

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">

        {/* Profile Image */}

        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center text-6xl">
            👨‍🌾
          </div>
        </div>

        {/* Heading */}

        <div className="text-center mt-5">

          <h1 className="text-3xl font-bold">
            {profile.username}
          </h1>

          <p className="text-gray-500 mt-2">
            {profile.email}
          </p>

        </div>

        {/* Profile Details */}

        <div className="grid md:grid-cols-2 gap-6 mt-10">

          <div>
            <label className="font-semibold">
              👤 Name
            </label>

            <input
              className="border rounded-lg p-3 w-full mt-2"
              disabled={!edit}
              value={profile.username}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  username: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-semibold">
              📧 Email
            </label>

            <input
              className="border rounded-lg p-3 w-full mt-2"
              disabled={!edit}
              value={profile.email}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  email: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-semibold">
              🏡 Village
            </label>

            <input
              className="border rounded-lg p-3 w-full mt-2"
              disabled={!edit}
              value={profile.village || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  village: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-semibold">
              📱 Mobile
            </label>

            <input
              className="border rounded-lg p-3 w-full mt-2"
              disabled={!edit}
              value={profile.mobile || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  mobile: e.target.value,
                })
              }
            />
          </div>

        </div>

        {/* Statistics */}

        <div className="grid md:grid-cols-2 gap-5 mt-10">

          <div className="bg-green-100 rounded-xl p-5 text-center">

            <h3 className="text-gray-600">
              📊 Total Scans
            </h3>

            <p className="text-3xl font-bold text-green-700">
              {profile.total_scans}
            </p>

          </div>

          <div className="bg-blue-100 rounded-xl p-5 text-center">

            <h3 className="text-gray-600">
              📅 Joined
            </h3>

            <p className="text-xl font-semibold">
              {profile.joined
                ? new Date(profile.joined).toLocaleDateString()
                : "-"}
            </p>

          </div>

        </div>

        {/* Buttons */}

        <div className="flex justify-center gap-4 mt-10">

          {!edit ? (
            <button
              onClick={() => setEdit(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={save}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
              >
                Save Changes
              </button>

              <button
                onClick={() => {
                  setEdit(false);
                  loadProfile();
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl"
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl"
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}