import { MathSolver } from './components/MathSolver';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-4">Vega Math Solver</h1>
      <MathSolver />
    </main>
  )
}