
export default function Sidebar({setActiveView, activeView}) {
    return (
        <aside className="sidebar">
            <div className="logo">
                <img src="/media/gem.svg" alt="Gem" className="sidebar-icon logo" />
            </div>
            <div className="menu">
                <div className={(activeView == "chat") ?  "menu-option active" : "menu-option"} onClick={() => setActiveView("chat")}>
                    <img src="/media/chat.svg" alt="Chat" className="sidebar-icon" />
                </div>
                <div className={(activeView == "friends") ?  "menu-option active" : "menu-option"} onClick={() => setActiveView("friends")}>
                    <img src="/media/users.svg" alt="Users" className="sidebar-icon" />
                </div>
                <div className={(activeView == "settings") ?  "menu-option active" : "menu-option"}>
                    <img src="/media/settings.svg" alt="Settings" className="sidebar-icon" onClick={() => setActiveView("settings")} />
                </div>
            </div>
            <h2 className="owebdev">OWEBDEV</h2>
        </aside>
    )
}