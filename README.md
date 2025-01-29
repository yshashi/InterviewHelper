# Angular Interview Guide

A comprehensive platform for Angular interview preparation, featuring in-depth explanations, practical examples, and best practices. Built with Astro and TailwindCSS.

## Features

- 📚 Comprehensive Angular interview questions and answers
- 💻 Interactive code examples with syntax highlighting
- 🌓 Dark/Light mode support
- 🔍 Full-text search functionality
- 📱 Responsive design for all devices
- ⚡ Fast performance with Astro
- 🎨 Beautiful UI with TailwindCSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/angular-interview.git
cd angular-interview
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:4321`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   └── Sidebar.astro
│   ├── layouts/
│   │   ├── Layout.astro
│   │   └── QuestionLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── questions/
│   │       └── what-is-angular.mdx
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
└── tsconfig.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Astro](https://astro.build)
- [TailwindCSS](https://tailwindcss.com)
- [Angular](https://angular.io)
