import { useNavigate } from 'react-router-dom'

export default function AddAccount() {
    const navigate = useNavigate()
    const currentName = localStorage.getItem('user_name') || 'Current User'
    const currentRole = localStorage.getItem('user_role') || 'student'

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50
      flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center
            text-2xl font-bold text-indigo-700 mx-auto mb-3">
                        {currentName[0]?.toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900">{currentName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
            ${currentRole === 'organizer'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-indigo-100 text-indigo-700'}`}>
                        {currentRole === 'organizer' ? '📋 Organizer' : '🎓 Student'}
                    </span>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-5 text-center">
                    Add Another Account
                </h2>

                <div className="space-y-3">
                    {/* Add Student Account */}
                    <button
                        onClick={() => navigate('/onboard')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2
              border-gray-100 hover:border-indigo-300 hover:bg-indigo-50
              transition-all group text-left">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center
              justify-center text-2xl flex-shrink-0 group-hover:bg-indigo-200 transition">
                            🎓
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 text-sm">Student Account</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                Discover events, RSVP, earn MAR points
                            </div>
                        </div>
                        <span className="ml-auto text-gray-300 group-hover:text-indigo-500 text-lg">→</span>
                    </button>

                    {/* Add Organizer Account */}
                    <button
                        onClick={() => navigate('/organizer-signup')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2
              border-gray-100 hover:border-purple-300 hover:bg-purple-50
              transition-all group text-left">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center
              justify-center text-2xl flex-shrink-0 group-hover:bg-purple-200 transition">
                            📋
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 text-sm">Organizer Account</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                Create events, approve certificates
                            </div>
                        </div>
                        <span className="ml-auto text-gray-300 group-hover:text-purple-500 text-lg">→</span>
                    </button>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full text-sm text-gray-400 hover:text-gray-600 transition py-2">
                        ← Go back
                    </button>
                </div>
            </div>
        </div>
    )
}