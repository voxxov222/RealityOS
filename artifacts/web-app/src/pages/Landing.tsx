import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Code2, Cpu, Globe2, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden flex flex-col items-center text-center px-4">
        {/* Background Image / Blur FX */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Futuristic background" 
            className="w-full h-full object-cover mix-blend-screen"
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-white/10 mb-8 mx-auto text-sm font-medium text-white/80">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">RealityOS 1.0 is live</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-black tracking-tighter text-white mb-8 leading-[1.1]">
            Describe it. <br/>
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]">
              RealityOS builds it.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            The all-in-one AI creative studio. Generate apps, websites, games, and 3D experiences simply by describing what you want to see.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              size="lg" 
              className="h-14 px-8 rounded-full bg-primary text-black font-bold text-lg shadow-[0_0_30px_hsl(var(--primary)_/_0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)_/_0.6)] hover:-translate-y-1 transition-all duration-300"
              onClick={() => window.location.href = "/api/login"}
            >
              Start Building Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 rounded-full border-white/20 text-white hover:bg-white/5 hover:text-white glass-panel font-semibold text-lg transition-all duration-300"
              asChild
            >
              <Link href="/community">Explore Gallery</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative z-10 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">One prompt, infinite possibilities.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our specialized AI agents handle the heavy lifting of coding, styling, and logic so you can focus on creativity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: "AI Agent", desc: "Interactive intelligence that writes production-ready code in real-time.", color: "text-blue-400" },
              { icon: Code2, title: "App Builder", desc: "Full-stack web applications wired with databases and auth.", color: "text-primary" },
              { icon: Globe2, title: "Websites", desc: "Beautifully designed, responsive landing pages and marketing sites.", color: "text-secondary" },
              { icon: Cpu, title: "Games & 3D", desc: "Interactive WebGL experiences and browser-based games.", color: "text-pink-400" }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-3xl border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-lg`}>
                  <feat.icon className={`w-7 h-7 ${feat.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Teaser */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Built by the community</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">Get inspired by what others are building with RealityOS.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { title: "Neon Cyberpunk City", tag: "3D", gradient: "from-purple-500/20 to-blue-500/20" },
              { title: "Personal Finance Dashboard", tag: "App", gradient: "from-cyan-500/20 to-emerald-500/20" },
              { title: "Retro Arcade Racer", tag: "Game", gradient: "from-pink-500/20 to-orange-500/20" },
            ].map((mock, i) => (
              <div key={i} className="aspect-[4/3] rounded-3xl glass-panel border-white/10 overflow-hidden relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${mock.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white mb-2 w-max border border-white/10">{mock.tag}</span>
                  <h3 className="text-white font-bold text-left text-lg">{mock.title}</h3>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" size="lg" className="rounded-full glass-panel border-white/20 hover:bg-white/10 hover:text-white" asChild>
            <Link href="/community">View the Full Gallery</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-6 h-6 object-contain opacity-50" />
          <span className="font-display font-bold text-white/50 tracking-wider">RealityOS</span>
        </div>
        <p>© {new Date().getFullYear()} RealityOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
