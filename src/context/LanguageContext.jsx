// src/context/LanguageContext.jsx
import { createContext, useContext, useState } from 'react'

const TRANSLATIONS = {
  en: {
    // Nav
    nav_journal: 'Journal',
    nav_new_trade: 'New Trade',
    nav_analytics: 'Analytics',
    nav_tools: 'Tools',
    nav_open: 'OPEN',
    nav_sign_out: 'Sign out',

    // Journal Page
    search_placeholder: 'Search symbol…',
    filter_all: 'ALL',
    trades_count: (n) => `${n} trades`,
    import_csv: 'Import CSV',
    importing: 'Importing…',
    export_csv: 'Export CSV',
    new_trade: 'New Trade',
    no_trades: 'No trades found. Start logging your first trade.',
    log_first_trade: '+ Log First Trade',
    // Table headers
    th_date: 'Date', th_symbol: 'Symbol', th_dir: 'Dir', th_entry: 'Entry',
    th_sl: 'SL', th_exits: 'Exits', th_net_pnl: 'Net P&L', th_close: 'Close',
    th_strategy: 'Strategy', th_status: 'Status',
    edit: 'Edit',
    delete_confirm: 'Delete this trade?',
    // Stats
    stat_net_pnl: 'Net P&L',
    stat_win_rate: 'Win Rate',
    stat_rr: 'Risk/Reward',
    stat_fees: 'Fees Paid',

    // Trade Page
    edit_trade: 'Edit Trade',
    log_new_trade: ' Log New Trade',
    trade_info: 'Trade Info',
    label_date: 'Date',
    label_symbol: 'Symbol *',
    label_symbol_placeholder: 'AAPL, BTC/USD…',
    label_asset: 'Asset Type',
    label_strategy: 'Strategy',
    label_direction: 'Direction',
    notes_status: 'Notes & Status',
    label_notes: 'Trade Thesis / Notes',
    notes_placeholder: 'Why did you take this trade? Setup, thesis, observations…',
    label_status: 'Status',
    btn_update: 'Update Trade',
    btn_log: 'Log Trade',
    btn_saving: 'Saving…',
    btn_cancel: 'Cancel',
    err_symbol: 'Symbol is required',
    err_price: 'Entry price is required',
    err_quantity: 'Quantity is required',

    // Analytics Page
    analytics_title: 'Performance Analytics',
    equity_curve: 'Equity Curve',
    monthly_pnl: 'Monthly P&L',
    win_loss_ratio: 'Win / Loss Ratio',
    strategy_breakdown: 'Strategy Breakdown',
    no_closed_trades: 'Close some trades to see analytics.',
    profit_factor: 'Profit Factor',
    stat_avg_win: 'Avg Win',
    stat_avg_loss: 'Avg Loss',
    stat_total_fees: 'Total Fees',

    // Auth Page
    brand_name: 'Trade Journal',
    welcome_back: 'Welcome',
    create_account: 'Create account',
    sign_in_sub: 'Sign in to your trading journal',
    register_sub: 'Start tracking your trades today',
    google_btn: 'Continue with Google',
    label_name: 'Full Name',
    label_email: 'Email',
    label_password: 'Password',
    btn_sign_in: 'Sign In',
    btn_create_account: 'Create Account',
    btn_please_wait: 'Please wait…',
    no_account: "Don't have an account?",
    have_account: 'Already have an account?',
    sign_up: 'Sign up',
    sign_in_link: 'Sign in',
  },
  km: {
    // Nav
    nav_journal: 'កំណត់ហេតុ',
    nav_new_trade: 'ពាណិជ្ជកម្មថ្មី',
    nav_analytics: 'វិភាគ',
    nav_tools: 'ឧបករណ៍',
    nav_open: 'បើក',
    nav_sign_out: 'ចាកចេញ',

    // Journal Page
    search_placeholder: 'ស្វែងរកនិមិត្តសញ្ញា…',
    filter_all: 'ទាំងអស់',
    trades_count: (n) => `${n} ពាណិជ្ជកម្ម`,
    import_csv: 'នាំចូល CSV',
    importing: 'កំពុងនាំចូល…',
    export_csv: 'នាំចេញ CSV',
    new_trade: 'ពាណិជ្ជកម្មថ្មី',
    no_trades: 'រកមិនឃើញពាណិជ្ជកម្ម។ ចាប់ផ្តើមកត់ត្រាពាណិជ្ជកម្មដំបូងរបស់អ្នក។',
    log_first_trade: '+ កត់ត្រាដំបូង',
    // Table headers
    th_date: 'កាលបរិច្ឆេទ', th_symbol: 'និមិត្ត', th_dir: 'ទិស', th_entry: 'ការចូល',
    th_sl: 'SL', th_exits: 'ចេញ', th_net_pnl: 'ចំណេញ/ខាត', th_close: 'បិទ',
    th_strategy: 'យុទ្ធសាស្ត្រ', th_status: 'ស្ថានភាព',
    edit: 'កែប្រែ',
    delete_confirm: 'លុបពាណិជ្ជកម្មនេះ?',
    // Stats
    stat_net_pnl: 'ចំណេញសុទ្ធ',
    stat_win_rate: 'អត្រាឈ្នះ',
    stat_rr: 'ហានិភ័យ/រង្វាន់',
    stat_fees: 'ថ្លៃសេវា',

    // Trade Page
    edit_trade: 'កែប្រែពាណិជ្ជកម្ម',
    log_new_trade: 'កត់ត្រាពាណិជ្ជកម្មថ្មី',
    trade_info: 'ព័ត៌មានពាណិជ្ជកម្ម',
    label_date: 'កាលបរិច្ឆេទ',
    label_symbol: 'និមិត្ត *',
    label_symbol_placeholder: 'AAPL, BTC/USD…',
    label_asset: 'ប្រភេទទ្រព្យ',
    label_strategy: 'យុទ្ធសាស្ត្រ',
    label_direction: 'ទិសដៅ',
    notes_status: 'កំណត់ចំណាំ និងស្ថានភាព',
    label_notes: 'ហេតុផល / កំណត់ចំណាំ',
    notes_placeholder: 'ហេតុអ្វីបានជាអ្នកធ្វើពាណិជ្ជកម្មនេះ? Setup, គំនិត, ការសង្កេត…',
    label_status: 'ស្ថានភាព',
    btn_update: 'រក្សាទុក',
    btn_log: 'កត់ត្រា',
    btn_saving: 'កំពុងរក្សាទុក…',
    btn_cancel: 'បោះបង់',
    err_symbol: 'សូមបញ្ចូលនិមិត្តសញ្ញា',
    err_price: 'សូមបញ្ចូលតម្លៃចូល',
    err_quantity: 'សូមបញ្ចូលចំនួន',

    // Analytics Page
    analytics_title: 'វិភាគប្រតិបត្តិការ',
    equity_curve: 'តារាងដើមទុន',
    monthly_pnl: 'ចំណេញ/ខាតប្រចាំខែ',
    win_loss_ratio: 'អត្រាឈ្នះ / ចាញ់',
    strategy_breakdown: 'វិភាគតាមយុទ្ធសាស្ត្រ',
    no_closed_trades: 'បិទពាណិជ្ជកម្មមួយដើម្បីមើលការវិភាគ',
    profit_factor: 'កត្តាចំណេញ',
    stat_avg_win: 'ឈ្នះជាមធ្យម',
    stat_avg_loss: 'ចាញ់ជាមធ្យម',
    stat_total_fees: 'ថ្លៃសេវាសរុប',

    // Auth Page
    brand_name: 'Trade Journal',
    welcome_back: 'សូមស្វាគមន៍ត្រឡប់មកវិញ',
    create_account: 'បង្កើតគណនី',
    sign_in_sub: 'ចូលទៅក្នុងកំណត់ហេតុពាណិជ្ជកម្មរបស់អ្នក',
    register_sub: 'ចាប់ផ្តើមតាមដានពាណិជ្ជកម្មរបស់អ្នកថ្ងៃនេះ',
    google_btn: 'បន្តជាមួយ Google',
    label_name: 'ឈ្មោះពេញ',
    label_email: 'អ៊ីមែល',
    label_password: 'ពាក្យសម្ងាត់',
    btn_sign_in: 'ចូលប្រព័ន្ធ',
    btn_create_account: 'បង្កើតគណនី',
    btn_please_wait: 'សូមមេត្តារង់ចាំ…',
    no_account: 'មិនទាន់មានគណនី?',
    have_account: 'មានគណនីរួចហើយ?',
    sign_up: 'ចុះឈ្មោះ',
    sign_in_link: 'ចូលប្រព័ន្ធ',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('ag_lang')
    return saved && TRANSLATIONS[saved] ? saved : 'en'
  })

  function switchLang(next) {
    setLang(next)
    localStorage.setItem('ag_lang', next)
  }

  const strings = TRANSLATIONS[lang] || TRANSLATIONS.en

  function t(key, ...args) {
    const val = strings[key]
    if (typeof val === 'function') return val(...args)
    return val ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>')
  return ctx
}