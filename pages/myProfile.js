import React, { useState, useEffect, useContext } from 'react';
import { Eye, EyeOff, Lock, AlertTriangle, Check, User, Mail, Phone, Calendar, Edit3, Save, X } from 'lucide-react';
import { Api } from '@/services/service';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { userContext } from './_app';

const MyProfile = (props) => {
    const router = useRouter();
    const [user, setUser] = useContext(userContext);
    const [profile, setProfile] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [passwordMode, setPasswordMode] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        props.loader(true)
        const data = {
            userId: user._id,
        }
        console.log("data", data)
        console.log("data", user)
        try {
            const res = await Api("post", "auth/profile", data, router);
            setProfile(res.data);
            setEditData(res.data);
        } catch (error) {
            toast.error(error?.message || "Failed to fetch profile")
        } finally {

            props.loader(false)
        }
    };

    // Password validation
    const validatePassword = (password) => {
        const checks = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        checks.isValid = Object.values(checks).every(Boolean);
        return checks;
    };


    const handleProfileSave = async () => {
        setIsLoading(true);
        loader(true);
        try {
            await Api("put", "user/updateProfile", editData, router);
            setProfile(editData);
            setEditMode(false);
            toaster({
                type: "success",
                message: "Profile updated successfully"
            });
        } catch (error) {
            toaster({
                type: "error",
                message: error?.message || "Failed to update profile"
            });
        } finally {
            setIsLoading(false);
            loader(false);
        }
    };


    const handlePasswordChange = async () => {
        const validation = validatePassword(passwordData.newPassword);

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("All fields are required")
            return;
        }

        if (!validation.isValid) {
            toast.error("Password doesn't meet requirements")
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords don't match")
            return;
        }

        setIsLoading(true);
        loader(true);
        try {

            await Api("post", "auth/changePasswordfromAdmin", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, router);

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordMode(false);
            toast.success(res?.message || "Password changed successfully")
        } catch (error) {
            toast.error(error?.message || "Failed to change password")
        } finally {
            setIsLoading(false);
            loader(false);
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const togglePassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const passwordValidation = validatePassword(passwordData.newPassword);
    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword;

    return (
        <div className="mb-8 w-full mx-auto p-4 bg-gray-50 py-2 min-h-screen max-h-[92vh] h-full overflow-y-scroll scrollbar-hide overflow-scroll pb-20">
            <h2 className="text-gray-800 font-bold md:text-3xl text-xl  flex items-center p-4">
                My Profile
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                <section className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                            <User className="h-5 w-5 mr-2 text-[#FF700099]" />
                            Profile Information
                        </h3>
                        <button
                            onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                            className="flex items-center px-4 py-2 text-sm bg-[#FF700099] text-black rounded-lg hover:bg-[#FF700099]/80"
                        >
                            {editMode ? <X className="h-4 w-4 mr-1" /> : <Edit3 className="h-4 w-4 mr-1" />}
                            {editMode ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Name - Read Only */}
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <User className="h-5 w-5 text-gray-500 mr-3" />
                            <div className="w-full">
                                <p className="text-sm text-gray-600 font-medium">Name</p>
                                <p className="text-gray-800">{profile.name || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Email - Read Only */}
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Mail className="h-5 w-5 text-gray-500 mr-3" />
                            <div className="w-full">
                                <p className="text-sm text-gray-600 font-medium">Email</p>
                                <p className="text-gray-800">{profile.email || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Phone - Editable */}
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Phone className="h-5 w-5 text-gray-500 mr-3" />
                            <div className="w-full">
                                <p className="text-sm text-gray-600 font-medium">Phone</p>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={editData.phone || ''}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        className="w-full text-black p-2 mt-1 border border-gray-300 rounded focus:border-[#FF700099] outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-800">{profile.phone || 'N/A'}</p>
                                )}
                            </div>
                        </div>

                        {/* Role & Status - Read Only */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex p-3  justify-start items-start bg-gray-50 rounded-lg">
                                <div className="">
                                    <span className={`px-2 py-1 mb-1 text-sm rounded-full font-medium ${profile.role === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {profile.role || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <div className="h-5 w-5 mr-3 flex items-center justify-center">
                                    <div className={`h-3 w-3 rounded-full ${profile.status === 'verified' ? 'bg-green-500' :
                                        profile.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                                        }`}></div>
                                </div>
                                <div>

                                    <p className="text-xs text-gray-800 capitalize">{profile.status || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Member Since */}
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Member Since</p>
                                <p className="text-gray-800">{profile.createdAt ? formatDate(profile.createdAt) : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Save Button */}
                        {editMode && (
                            <button
                                onClick={handleProfileSave}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-2 bg-[#FF700099] text-black rounded-lg hover:bg-[#FF700099]/80 disabled:bg-gray-400"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </section>

                {/* Password Section */}
                <section className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                            <Lock className="h-5 w-5 mr-2 text-[#FF700099]" />
                            Security
                        </h3>
                        <button
                            onClick={() => setPasswordMode(!passwordMode)}
                            className="flex items-center px-4 py-2 text-sm bg-[#FF700099] text-black rounded-lg hover:bg-[#FF700099]/80"
                        >
                            <Lock className="h-4 w-4 mr-1" />
                            Change Password
                        </button>
                    </div>

                    {passwordMode ? (
                        <div className="space-y-4">
                            {/* Current Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full text-black p-3 border border-gray-300 rounded-lg focus:border-[#FF700099] outline-none pr-10"
                                        placeholder="Enter Current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePassword('current')}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full text-black p-3 border border-gray-300 rounded-lg focus:border-[#FF700099] outline-none pr-10"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePassword('new')}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            {passwordData.newPassword && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="text-xs font-medium text-gray-700 mb-2">Requirements:</h4>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        {Object.entries({
                                            'minLength': '8+ chars',
                                            'hasUpperCase': 'Uppercase',
                                            'hasLowerCase': 'Lowercase',
                                            'hasNumbers': 'Number',
                                            'hasSpecialChar': 'Special char'
                                        }).map(([key, label]) => (
                                            <div key={key} className={`flex items-center ${passwordValidation[key] ? 'text-green-600' : 'text-red-600'}`}>
                                                <Check className={`h-3 w-3 mr-1 ${passwordValidation[key] ? 'opacity-100' : 'opacity-30'}`} />
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full p-3 border text-black border-gray-300 rounded-lg focus:border-[#FF700099] outline-none pr-10"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePassword('confirm')}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {passwordData.confirmPassword && (
                                    <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        setPasswordMode(false)
                                    }}
                                    className="flex-1 border border-[#FF700099] shodow-md px-4 py-2  text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-[#FF700099] text-black rounded-lg hover:bg-[#FF700099]/80 disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Saving...' : 'Change Password'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center min-h-[400px]">
                            <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Click "Change Password" to update your password</p>
                            <p className="text-xs text-gray-400 mt-2">Last updated: {profile.updatedAt ? formatDate(profile.updatedAt) : 'N/A'}</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default MyProfile;