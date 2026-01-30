import { Sparkles } from "@/components/ui/sparkles"
import { Award, Users, Target, Lightbulb } from "lucide-react"

export function AboutRareMinds() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-zinc-900">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 py-32">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            <span className="text-indigo-900 dark:text-indigo-200">Empowering Minds.</span>
            <br />
            <span>Shaping Futures.</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            RareMinds is dedicated to transforming education through innovative technology 
            and personalized learning experiences that unlock every student's potential.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard icon={<Users className="w-8 h-8" />} value="10,000+" label="Students" />
          <StatCard icon={<Award className="w-8 h-8" />} value="500+" label="Educators" />
          <StatCard icon={<Target className="w-8 h-8" />} value="95%" label="Success Rate" />
          <StatCard icon={<Lightbulb className="w-8 h-8" />} value="1,000+" label="Courses" />
        </div>

        {/* Mission Section */}
        <div className="mt-32 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              We believe that every student deserves access to world-class education 
              tailored to their unique learning style and career aspirations.
            </p>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Through cutting-edge AI technology and expert educators, we're building 
              a platform that adapts to each learner's journey, providing personalized 
              guidance every step of the way.
            </p>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop" 
              alt="Students collaborating"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-center text-zinc-900 dark:text-white mb-16">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard 
              title="Innovation"
              description="We constantly push boundaries to create better learning experiences through technology."
              icon="💡"
            />
            <ValueCard 
              title="Accessibility"
              description="Quality education should be available to everyone, regardless of background or location."
              icon="🌍"
            />
            <ValueCard 
              title="Excellence"
              description="We maintain the highest standards in content quality and educational outcomes."
              icon="⭐"
            />
          </div>
        </div>
      </div>

      {/* Sparkles Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative -mt-32 h-full w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
          <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#8350e8,transparent_70%)] before:opacity-40" />
          <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-zinc-900/20 dark:border-white/20 bg-white dark:bg-zinc-900" />
          <Sparkles
            density={1200}
            className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
            color="#8350e8"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center p-6 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:shadow-lg transition-shadow">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mb-4">
        {icon}
      </div>
      <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{value}</div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
    </div>
  )
}

function ValueCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}
