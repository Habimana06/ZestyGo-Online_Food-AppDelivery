import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      const existing = state.find((i) => i.id === action.payload.id);
      if (existing) {
        return state.map((i) => (i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...state, { ...action.payload, quantity: 1 }];
    case 'REMOVE':
      return state.filter((i) => i.id !== action.payload);
    case 'UPDATE':
      const { id, change } = action.payload;
      return state.map((i) => {
        if (i.id !== id) return i;
        const qty = i.quantity + change;
        return qty <= 0 ? null : { ...i, quantity: qty };
      }).filter(Boolean);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, [], (init) => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || init;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => dispatch({ type: 'ADD', payload: item });
  const removeFromCart = (id) => dispatch({ type: 'REMOVE', payload: id });
  const updateQuantity = (id, change) => dispatch({ type: 'UPDATE', payload: { id, change } });
  const clearCart = () => dispatch({ type: 'CLEAR' });
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
