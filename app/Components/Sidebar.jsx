
export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="logo">
                <img src="/media/gem.svg" alt="Gem" className="sidebar-icon logo" />
            </div>
            <div className="menu">
                <div className="menu-option active">
                    <img src="/media/chat.svg" alt="Chat" className="sidebar-icon" />
                </div>
                <div className="menu-option">
                    <img src="/media/users.svg" alt="Users" className="sidebar-icon" />
                </div>
                <div className="menu-option">
                    <img src="/media/settings.svg" alt="Settings" className="sidebar-icon" />
                </div>
            </div>
            <h2 className="owebdev">OWEBDEV</h2>
        </aside>
    )
}