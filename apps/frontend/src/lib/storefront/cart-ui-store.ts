import { create } from 'zustand';

/**
 * Ephemeral UI state for the global cart drawer. Cart *data* lives in TanStack
 * Query (built in P2); this store only tracks whether the drawer is open.
 */
interface CartUiState {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartUiStore = create<CartUiState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}));
