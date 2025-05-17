export const getInitials = (name: string | undefined): string => {
  if (!name) return "NA";
  const nameParts = name.split(" ");
  const initials = nameParts
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
  return initials;
};
