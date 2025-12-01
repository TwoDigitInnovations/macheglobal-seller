import React from "react";
import { useRouter } from "next/router";
import { AlertTriangle, ChevronLeft, LayoutGrid } from "lucide-react";


export default function Admin404() {
    const router = useRouter();

    return (
        <div className="min-h-[700px] w-full bg-gradient-to-br from-white to-[#fff7f0] flex items-center justify-center p-6">
            {/* Card */}
            <div className="w-full max-w-2xl rounded-2xl shadow-xl bg-white border border-[#ff700033] relative overflow-hidden">
                {/* Accent ribbon */}
                <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: "linear-gradient(90deg, #FF7000, #FF700099)" }}
                />

                <div className="px-8 py-10 text-center">
                    {/* Icon Badge */}
                    <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                            background: "#FF700014",
                            border: "1px solid #FF700029",
                        }}>
                        <AlertTriangle className="w-8 h-8" style={{ color: "#FF7000" }} />
                    </div>

                    {/* 404 Heading */}
                    <h1 className="text-6xl font-extrabold tracking-tight leading-none">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF7000] to-[#FF700099]">
                            404
                        </span>
                    </h1>
                    <p className="mt-3 text-xl font-semibold text-neutral-900">Page not found</p>
                    <p className="mt-2 text-neutral-600">
                        The page you’re looking for doesn’t exist or has been moved.
                    </p>

                    {/* Quick Links */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => router.back()}
                            className="group inline-flex items-center justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium hover:border-neutral-300 text-black transition shadow-sm"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Go back
                        </button>

                        <div
                            onClick={() => router.push("/")
                            }
                            className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                                background: "linear-gradient(90deg, #FF7000, #FF700099)",
                                color: "#ffffff",
                                boxShadow: "0 8px 20px -8px #FF700099",
                            }}
                        >
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Go to Dashboard
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
