export const generateReference = (id) => {
  return `V-${String(id).padStart(4, '0')}`;
};