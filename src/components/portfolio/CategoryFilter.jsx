import { motion } from "framer-motion";

export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(null)}
        className={`px-6 py-2.5 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300 border ${
          selected === null
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
        }`}
      >
        Todos
      </motion.button>
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.id)}
          className={`px-6 py-2.5 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300 border ${
            selected === cat.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
          }`}
        >
          {cat.name}
        </motion.button>
      ))}
    </div>
  );
}
