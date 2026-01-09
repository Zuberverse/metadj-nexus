import { expect, type Page } from '@playwright/test';

export async function setWelcomeDismissed(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('metadj-nexus-welcome-shown', 'true');
    window.localStorage.setItem('metadj-nexus-welcome-dismissed', 'true');
    window.localStorage.setItem('metadj_active_view', 'hub');
    window.localStorage.setItem('metadj_left_panel_tab', 'browse');
    window.localStorage.removeItem('metadj_queue_state');
    window.sessionStorage.setItem('metadj_panel_state', JSON.stringify({
      left: { isOpen: false },
      right: { isOpen: false },
    }));
    window.sessionStorage.setItem('metadj_welcome_shown_session', 'true');
  });
}

export async function waitForMainContent(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const desktopMain = document.getElementById('main-content-desktop');
    const mobileMain = document.getElementById('main-content-mobile');
    const isVisible = (el: HTMLElement | null) => Boolean(el && el.getClientRects().length > 0);

    return isVisible(desktopMain) || isVisible(mobileMain);
  });
}
